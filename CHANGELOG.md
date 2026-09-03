# Changelog

All notable changes to this project are documented in this file.

This repository is pre-1.0. Minor versions may contain breaking changes; patch versions do not.

## [Unreleased]

### Fixed

- The Compute Engine create form now sends the selected provisioning model. `instanceType` was
  never part of the create payload, so every instance was created as `shared` no matter what the
  customer picked.

### Changed

- The Dedicated provisioning model is offered when the cluster reports it can schedule one, rather
  than being disabled by a constant in the form. Availability comes from
  `GET /api/compute-engines/instance-types`, which fails closed to `shared`, so an unreachable
  capability check greys the option out instead of breaking the form.

## [0.5.0]

_History not reconstructed._
