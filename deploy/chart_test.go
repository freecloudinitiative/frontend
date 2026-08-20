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

// parseAllDocs splits a multi-document YAML string and unmarshals each document
// that has the requested kind. Returns a slice of maps.
//
// helm template output begins with a bare "---" on the first line (no preceding
// newline). Prepending "\n" means the very first "---" is also caught by the
// "\n---" split.
func parseAllDocs(t *testing.T, rendered, kind string) []map[string]interface{} {
	t.Helper()
	// Prepend a newline so that a leading "---" at byte 0 is also found by
	// the "\n---" split boundary.
	rendered = "\n" + rendered

	var result []map[string]interface{}
	for _, doc := range strings.Split(rendered, "\n---") {
		doc = strings.TrimSpace(doc)
		if doc == "" {
			continue
		}
		// Strip leading comment lines (helm adds "# Source: ..." after ---)
		lines := strings.Split(doc, "\n")
		var contentLines []string
		for _, l := range lines {
			if strings.HasPrefix(strings.TrimSpace(l), "#") {
				continue
			}
			contentLines = append(contentLines, l)
		}
		doc = strings.TrimSpace(strings.Join(contentLines, "\n"))
		if doc == "" {
			continue
		}
		var m map[string]interface{}
		if err := yaml.Unmarshal([]byte(doc), &m); err != nil {
			continue
		}
		if m == nil {
			continue
		}
		if m["kind"] == kind {
			result = append(result, m)
		}
	}
	return result
}

// ─────────────────────────────────────────────────────────────────────────────
// TestChart_ConfigJSMatchesRuntimeConfigShape
//
// The rendered config.js must be valid JS that assigns window.__FCI_CONFIG__ and
// carries every field from the RuntimeConfig interface in src/lib/runtimeConfig.ts.
// ─────────────────────────────────────────────────────────────────────────────

func TestChart_ConfigJSMatchesRuntimeConfigShape(t *testing.T) {
	rendered := helmTemplate(t, "--set", "image.tag=test")

	// Extract the ConfigMap data.config.js value.
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

	// Strip the JS assignment wrapper to obtain the JSON object.
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

	cms := parseAllDocs(t, rendered, "ConfigMap")
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

	const prefix = "window.__FCI_CONFIG__ = "
	const suffix = ";"
	js := strings.TrimSpace(configJS)
	jsonPart := strings.TrimPrefix(js, prefix)
	jsonPart = strings.TrimSuffix(strings.TrimSpace(jsonPart), suffix)

	var cfg map[string]interface{}
	if err := json.Unmarshal([]byte(jsonPart), &cfg); err != nil {
		t.Fatalf("config.js JSON does not parse: %v", err)
	}

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

func TestChart_ServiceAndContainerPortAre8080(t *testing.T) {
	rendered := helmTemplate(t, "--set", "image.tag=test")

	// Check Service port.
	svcs := parseAllDocs(t, rendered, "Service")
	if len(svcs) == 0 {
		t.Fatal("no Service found")
	}
	for _, svc := range svcs {
		spec, _ := svc["spec"].(map[string]interface{})
		ports, _ := spec["ports"].([]interface{})
		for _, p := range ports {
			pm, _ := p.(map[string]interface{})
			port := int(toFloat64(pm["port"]))
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
		spec, _ := dep["spec"].(map[string]interface{})
		template, _ := spec["template"].(map[string]interface{})
		podSpec, _ := template["spec"].(map[string]interface{})
		containers, _ := podSpec["containers"].([]interface{})
		for _, c := range containers {
			cm, _ := c.(map[string]interface{})
			cports, _ := cm["ports"].([]interface{})
			for _, cp := range cports {
				cpm, _ := cp.(map[string]interface{})
				if int(toFloat64(cpm["containerPort"])) == 8080 {
					found8080 = true
				}
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
			em, _ := e.(map[string]interface{})
			tos, _ := em["to"].([]interface{})
			ports, _ := em["ports"].([]interface{})

			isBackend := false
			for _, to := range tos {
				tom, _ := to.(map[string]interface{})
				if nsSelector, ok := tom["namespaceSelector"].(map[string]interface{}); ok {
					labels, _ := nsSelector["matchLabels"].(map[string]interface{})
					if labels["kubernetes.io/metadata.name"] == "backend" {
						isBackend = true
					}
				}
			}

			for _, p := range ports {
				pm, _ := p.(map[string]interface{})
				port := int(toFloat64(pm["port"]))
				if port == 80 {
					foundPort80 = true
				}
				if isBackend && port == 8080 {
					found8080ToBackend = true
				}
			}
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

		// Collect all emptyDir volume names.
		emptyDirVols := map[string]bool{}
		vols, _ := podSpec["volumes"].([]interface{})
		for _, v := range vols {
			vm, _ := v.(map[string]interface{})
			name, _ := vm["name"].(string)
			if _, ok := vm["emptyDir"]; ok {
				emptyDirVols[name] = true
			}
		}

		// Collect volumeMount paths for those emptyDir volumes.
		mountedPaths := map[string]bool{}
		containers, _ := podSpec["containers"].([]interface{})
		for _, c := range containers {
			cm, _ := c.(map[string]interface{})
			vms, _ := cm["volumeMounts"].([]interface{})
			for _, vm := range vms {
				vmm, _ := vm.(map[string]interface{})
				volName, _ := vmm["name"].(string)
				path, _ := vmm["mountPath"].(string)
				if emptyDirVols[volName] {
					mountedPaths[path] = true
				}
			}
		}

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
		fmt.Fprintln(os.Stderr, "helm not found in PATH; skipping chart tests")
		os.Exit(0)
	}
	os.Exit(m.Run())
}
