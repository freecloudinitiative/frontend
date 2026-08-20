// Package deploy contains Helm chart render tests for the frontend chart.
// Tests shell out to `helm template` and parse the rendered YAML to assert
// invariants that are easy to get wrong silently (port numbers, mount paths,
// ConfigMap shape, image reference).
//
// Run with:
//
//	go test ./deploy/...
package deploy

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

// chartDir resolves the path to the deploy/ directory relative to this file.
func chartDir(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller failed")
	}
	return filepath.Dir(file)
}

// helmTemplate runs `helm template` with the given extra args and returns stdout.
// It fails the test on any non-zero exit code.
func helmTemplate(t *testing.T, extraArgs ...string) string {
	t.Helper()
	dir := chartDir(t)
	args := append([]string{"template", "frontend", dir}, extraArgs...)
	cmd := exec.Command("helm", args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		t.Fatalf("helm template failed: %v\nstderr: %s", err, stderr.String())
	}
	return stdout.String()
}

// helmTemplateMustFail runs `helm template` and expects a non-zero exit code.
func helmTemplateMustFail(t *testing.T, extraArgs ...string) {
	t.Helper()
	dir := chartDir(t)
	args := append([]string{"template", "frontend", dir}, extraArgs...)
	cmd := exec.Command("helm", args...)
	if err := cmd.Run(); err == nil {
		t.Fatal("expected helm template to fail, but it succeeded")
	}
}

// stripComments removes comment lines from YAML text.
func stripComments(raw string) string {
	var lines []string
	for _, l := range strings.Split(raw, "\n") {
		if !strings.HasPrefix(strings.TrimSpace(l), "#") {
			lines = append(lines, l)
		}
	}
	return strings.TrimSpace(strings.Join(lines, "\n"))
}

// parseDoc unmarshals a single document YAML string into a map.
func parseDoc(raw string) map[string]interface{} {
	cleaned := stripComments(raw)
	if cleaned == "" {
		return nil
	}
	var m map[string]interface{}
	if err := yaml.Unmarshal([]byte(cleaned), &m); err != nil {
		return nil
	}
	return m
}

// parseAllDocs splits a multi-document YAML string and unmarshals each document
// that has the requested kind. Returns a slice of maps.
func parseAllDocs(t *testing.T, rendered, kind string) []map[string]interface{} {
	t.Helper()
	var result []map[string]interface{}
	for _, doc := range strings.Split("\n"+rendered, "\n---") {
		m := parseDoc(doc)
		if m != nil && m["kind"] == kind {
			result = append(result, m)
		}
	}
	return result
}

// extractConfigJSON extracts and unmarshals the window.__FCI_CONFIG__ object from ConfigMap.
func extractConfigJSON(t *testing.T, rendered string) map[string]interface{} {
	t.Helper()
	cms := parseAllDocs(t, rendered, "ConfigMap")
	if len(cms) == 0 {
		t.Fatal("no ConfigMap found in rendered chart")
	}

	var configJS string
	for _, cm := range cms {
		data, ok := cm["data"].(map[string]interface{})
		if !ok {
			continue
		}
		if v, ok := data["config.js"].(string); ok {
			configJS = v
			break
		}
	}
	if configJS == "" {
		t.Fatal("config.js key not found in any ConfigMap")
	}

	const prefix = "window.__FCI_CONFIG__ = "
	const suffix = ";"
	js := strings.TrimSpace(configJS)
	if !strings.HasPrefix(js, prefix) {
		t.Fatalf("config.js must start with %q, got: %s", prefix, js)
	}
	jsonPart := strings.TrimPrefix(js, prefix)
	jsonPart = strings.TrimSuffix(strings.TrimSpace(jsonPart), suffix)

	var cfg map[string]interface{}
	if err := json.Unmarshal([]byte(jsonPart), &cfg); err != nil {
		t.Fatalf("config.js JSON does not parse: %v\nContent: %s", err, jsonPart)
	}
	return cfg
}

// ─────────────────────────────────────────────────────────────────────────────
// TestChart_ConfigJSMatchesRuntimeConfigShape
//
// The rendered config.js must be valid JS that assigns window.__FCI_CONFIG__ and
// carries every field from the RuntimeConfig interface in src/lib/runtimeConfig.ts.
// ─────────────────────────────────────────────────────────────────────────────

func TestChart_ConfigJSMatchesRuntimeConfigShape(t *testing.T) {
	rendered := helmTemplate(t, "--set", "image.tag=test")
	cfg := extractConfigJSON(t, rendered)

	// Required fields from src/lib/runtimeConfig.ts RuntimeConfig interface.
	requiredFields := []string{
		"appEnv",
		"apiBaseUrl",
		"oidcAuthority",
		"oidcClientId",
		"oidcRedirectUri",
		"enableRealTerminal",
		"wsBaseUrl",
	}
	for _, field := range requiredFields {
		if _, ok := cfg[field]; !ok {
			t.Errorf("config.js missing RuntimeConfig field: %q", field)
		}
	}

	// enableRealTerminal must serialise as a boolean, not a string.
	if v, ok := cfg["enableRealTerminal"]; ok {
		if _, isBool := v.(bool); !isBool {
			t.Errorf("enableRealTerminal must be a JSON boolean, got %T (%v)", v, v)
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// TestChart_OIDCMatchesAuthentikBlueprint
//
// The OIDC values in the chart must match what the Authentik blueprint registers.
// These are hardcoded so a typo in values.yaml is caught immediately.
// ─────────────────────────────────────────────────────────────────────────────

func TestChart_OIDCMatchesAuthentikBlueprint(t *testing.T) {
	rendered := helmTemplate(t, "--set", "image.tag=test")
	cfg := extractConfigJSON(t, rendered)

	// Values must match the Authentik blueprint:
	//   k3s-manifests/infrastructure/authentik/blueprint.yaml
	want := map[string]string{
		"oidcAuthority":   "https://auth.freecloudinitiative.com/application/o/freecloudinitiative/",
		"oidcClientId":    "freecloudinitiative-frontend",
		"oidcRedirectUri": "https://frontend.freecloudinitiative.com/callback",
	}
	for field, expected := range want {
		got, ok := cfg[field].(string)
		if !ok {
			t.Errorf("field %q missing or not a string", field)
			continue
		}
		if got != expected {
			t.Errorf("field %q = %q, want %q", field, got, expected)
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// TestChart_ServiceAndContainerPortAre8080
//
// nginx-unprivileged listens on 8080 (USER 101). The Service port and the
// container port must both be 8080 — never 80.
// ─────────────────────────────────────────────────────────────────────────────

func extractServicePorts(svc map[string]interface{}) []int {
	spec, _ := svc["spec"].(map[string]interface{})
	ports, _ := spec["ports"].([]interface{})
	var result []int
	for _, p := range ports {
		if pm, ok := p.(map[string]interface{}); ok {
			result = append(result, int(toFloat64(pm["port"])))
		}
	}
	return result
}

func extractContainerPorts(dep map[string]interface{}) []int {
	spec, _ := dep["spec"].(map[string]interface{})
	template, _ := spec["template"].(map[string]interface{})
	podSpec, _ := template["spec"].(map[string]interface{})
	containers, _ := podSpec["containers"].([]interface{})
	var result []int
	for _, c := range containers {
		cm, ok := c.(map[string]interface{})
		if !ok {
			continue
		}
		cports, _ := cm["ports"].([]interface{})
		for _, cp := range cports {
			if cpm, ok := cp.(map[string]interface{}); ok {
				result = append(result, int(toFloat64(cpm["containerPort"])))
			}
		}
	}
	return result
}

func TestChart_ServiceAndContainerPortAre8080(t *testing.T) {
	rendered := helmTemplate(t, "--set", "image.tag=test")

	// Check Service port.
	svcs := parseAllDocs(t, rendered, "Service")
	if len(svcs) == 0 {
		t.Fatal("no Service found")
	}
	for _, svc := range svcs {
		for _, port := range extractServicePorts(svc) {
			if port != 8080 {
				t.Errorf("Service port = %d, want 8080", port)
			}
		}
	}

	// Check container port.
	deps := parseAllDocs(t, rendered, "Deployment")
	if len(deps) == 0 {
		t.Fatal("no Deployment found")
	}
	found8080 := false
	for _, dep := range deps {
		for _, port := range extractContainerPorts(dep) {
			if port == 8080 {
				found8080 = true
			}
		}
	}
	if !found8080 {
		t.Error("no container port 8080 found in Deployment")
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// TestChart_NetworkPolicyEgressTargetsPodPort8080
//
// api-gateway binds 8080 internally (nginx-unprivileged). The egress rule to
// namespace backend must target port 8080, not 80.
// ─────────────────────────────────────────────────────────────────────────────

func egressTargetsNamespace(tos []interface{}, namespace string) bool {
	for _, to := range tos {
		tom, ok := to.(map[string]interface{})
		if !ok {
			continue
		}
		nsSelector, ok := tom["namespaceSelector"].(map[string]interface{})
		if !ok {
			continue
		}
		labels, _ := nsSelector["matchLabels"].(map[string]interface{})
		if labels["kubernetes.io/metadata.name"] == namespace {
			return true
		}
	}
	return false
}

func extractPorts(ports []interface{}) []int {
	var result []int
	for _, p := range ports {
		if pm, ok := p.(map[string]interface{}); ok {
			result = append(result, int(toFloat64(pm["port"])))
		}
	}
	return result
}

func inspectEgressRules(egressRule map[string]interface{}) (hasBackend8080, hasPort80 bool) {
	tos, _ := egressRule["to"].([]interface{})
	ports, _ := egressRule["ports"].([]interface{})
	isBackend := egressTargetsNamespace(tos, "backend")

	for _, port := range extractPorts(ports) {
		if port == 80 {
			hasPort80 = true
		}
		if isBackend && port == 8080 {
			hasBackend8080 = true
		}
	}
	return hasBackend8080, hasPort80
}

func TestChart_NetworkPolicyEgressTargetsPodPort8080(t *testing.T) {
	rendered := helmTemplate(t, "--set", "image.tag=test")
	nps := parseAllDocs(t, rendered, "NetworkPolicy")
	if len(nps) == 0 {
		t.Fatal("no NetworkPolicy found")
	}

	found8080ToBackend := false
	foundPort80 := false

	for _, np := range nps {
		spec, _ := np["spec"].(map[string]interface{})
		egresses, _ := spec["egress"].([]interface{})
		for _, e := range egresses {
			em, ok := e.(map[string]interface{})
			if !ok {
				continue
			}
			hasBackend, has80 := inspectEgressRules(em)
			found8080ToBackend = found8080ToBackend || hasBackend
			foundPort80 = foundPort80 || has80
		}
	}

	if !found8080ToBackend {
		t.Error("NetworkPolicy egress to namespace backend must have port 8080")
	}
	if foundPort80 {
		t.Error("NetworkPolicy must not use port 80 — api-gateway binds 8080")
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// TestChart_WritableMountsForReadOnlyRootFilesystem
//
// readOnlyRootFilesystem: true requires four writable emptyDir mounts.
// Missing any one of them crash-loops the container at start.
// ─────────────────────────────────────────────────────────────────────────────

func collectEmptyDirVolumeNames(podSpec map[string]interface{}) map[string]bool {
	names := make(map[string]bool)
	vols, _ := podSpec["volumes"].([]interface{})
	for _, v := range vols {
		vm, ok := v.(map[string]interface{})
		if !ok {
			continue
		}
		if _, ok := vm["emptyDir"]; ok {
			if name, ok := vm["name"].(string); ok {
				names[name] = true
			}
		}
	}
	return names
}

func collectMountedPaths(containers []interface{}, emptyDirVols map[string]bool) map[string]bool {
	paths := make(map[string]bool)
	for _, c := range containers {
		cm, ok := c.(map[string]interface{})
		if !ok {
			continue
		}
		vms, _ := cm["volumeMounts"].([]interface{})
		for _, vm := range vms {
			vmm, ok := vm.(map[string]interface{})
			if !ok {
				continue
			}
			volName, _ := vmm["name"].(string)
			path, _ := vmm["mountPath"].(string)
			if emptyDirVols[volName] {
				paths[path] = true
			}
		}
	}
	return paths
}

func TestChart_WritableMountsForReadOnlyRootFilesystem(t *testing.T) {
	rendered := helmTemplate(t, "--set", "image.tag=test")
	deps := parseAllDocs(t, rendered, "Deployment")
	if len(deps) == 0 {
		t.Fatal("no Deployment found")
	}

	requiredMounts := []string{
		"/tmp",
		"/var/cache/nginx",
		"/var/run",
		"/etc/nginx/conf.d",
	}

	for _, dep := range deps {
		spec, _ := dep["spec"].(map[string]interface{})
		template, _ := spec["template"].(map[string]interface{})
		podSpec, _ := template["spec"].(map[string]interface{})
		emptyDirVols := collectEmptyDirVolumeNames(podSpec)
		containers, _ := podSpec["containers"].([]interface{})
		mountedPaths := collectMountedPaths(containers, emptyDirVols)

		for _, req := range requiredMounts {
			if !mountedPaths[req] {
				t.Errorf("required emptyDir mount %q not found in Deployment", req)
			}
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// TestChart_FailsWithoutTagOrDigest
//
// Deploying without an image tag or digest would pull the wrong image.
// The _helpers.tpl image helper must fail loudly so CI catches it early.
// ─────────────────────────────────────────────────────────────────────────────

func TestChart_FailsWithoutTagOrDigest(t *testing.T) {
	// Default values have both tag and digest empty — must fail.
	helmTemplateMustFail(t)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// toFloat64 converts interface{} numeric values (YAML unmarshals numbers as int or float64).
func toFloat64(v interface{}) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case int:
		return float64(n)
	case uint:
		return float64(n)
	case int64:
		return float64(n)
	case uint64:
		return float64(n)
	default:
		return 0
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// TestMain — prerequisite check
// ─────────────────────────────────────────────────────────────────────────────

func TestMain(m *testing.M) {
	if _, err := exec.LookPath("helm"); err != nil {
		fmt.Fprintln(os.Stderr, "helm not found in PATH; cannot run chart tests")
		os.Exit(1)
	}
	os.Exit(m.Run())
}
