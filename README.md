# Conflict Atlas

Perform a three-way merge of flat records while preserving conflicting edits.

**Status:** implemented browser-local research prototype. Automated tests can be reproduced with the command below. GitHub Pages deployed and browser smoke checks completed on 19 November 2026.

## Website

Live website: https://royalpuskar.github.io/conflict-atlas/

## Problem and approach

This tool makes the supplied reliability scenario inspectable through explicit rules, per-item results, and exportable evidence. It runs the same pure JavaScript engine in the browser and Node tests. All input is provided by the user or the included synthetic fixture; no external facts are inferred.

## Implemented features

- Editable scenario with a synthetic example and reset control.
- Deterministic analysis, summary metrics, filterable result table, and JSON report export.
- Input validation, explicit errors, and invalidation of outdated reports after edits.
- Keyboard-accessible controls, responsive layout, and large-screen CSS.
- Zero runtime dependencies and no external API calls.

## Install and run

Requirements: Python 3 for a static local server, Node.js 22 or later for tests.

```sh
git clone https://github.com/Royalpuskar/conflict-atlas.git
cd conflict-atlas
python3 -m http.server 8000
```

Open http://localhost:8000. Do not open index.html through a file URL; ES modules require a server.

```sh
node --test test.mjs
```

## Example and schema

The complete example in `sample.mjs` defines the supported input shape:

```json
{
  "base": {
    "title": "Draft",
    "owner": "A"
  },
  "left": {
    "title": "Final",
    "owner": "A"
  },
  "right": {
    "title": "Review",
    "owner": "B"
  }
}
```

Edit one value and select **Run analysis**. **Reset example** restores the fixture. **Export report** downloads the current result; it never publishes it.

Input is capped at 200,000 serialized characters. Base, left and right must be flat records containing JSON scalar values; arrays and nested records are unsupported. Domain constraints are checked inside `engine.mjs`.

## Presence-safe merge results

The engine reads **own fields only**, including names such as `__proto__`, `constructor` and `toString`. Missing fields never fall back to inherited object properties. Values are limited to JSON scalars: strings, finite numbers, booleans and null. Direct module calls with undefined, functions, symbols, BigInt, nested objects, accessors or inherited-record prototypes are rejected.

The report retains its display-oriented `rows` and adds:

- `fieldStates`: each field has tagged base/left/right states and a resolution. A state is `{kind: "value", value: ...}`, `{kind: "absent"}` or, for unresolved output, `{kind: "conflict"}`.
- `complete`: true only when every field can be merged without a human decision.
- `mergedRecord`: the complete record when conflict-free; otherwise null. Conflicted fields are never silently omitted from an apparently complete merge.

A missing field means deletion; null, false, zero and the empty string are ordinary values. Literal strings such as `"[deleted]"` remain values, not control markers. The browser table quotes scalar strings and labels actual absence separately. Machine consumers should use `fieldStates` and `mergedRecord`, not interpret strings in legacy display rows.

For each field: matching edits merge; if only one side differs from the base, that side wins; two different changes produce a conflict. A deletion against an unchanged base deletes the field; deletion against an independent edit conflicts. Prototype-named output fields are created as own data properties, and survive JSON export without changing the output object's prototype.

## Architecture and request flow

`index.html` loads `app.mjs`, which parses scenario JSON and calls `run` from `engine.mjs`. The engine returns `metrics` and `rows`; the UI renders values with `textContent`, never user-supplied HTML. Editing invalidates the prior report. Export creates a local Blob download.

There is no application authentication, credential store, session cookie, or token lifecycle. GitHub Pages serves public static files. The app does not collect passwords or API keys, contact third-party APIs, persist inputs, or send scenario data over the network. GitHub hosting can still receive ordinary page request metadata. Reloading discards edits.

## Limitations

Flat scalar-valued records only; conflicts require a human decision. Not a CRDT or automatic reconciliation service.

The interface shares a portfolio design system, while this repository has its own domain engine, fixture, and tests. No accuracy, novelty, production-readiness, or 4K visual-test claim is made. Large-screen CSS is not a substitute for device testing.

## Validation

Ten local tests pass for the current engine, including prototype-named fields, literal display-marker strings, deletion versus null, rejected non-JSON values and accessors, and all 125 combinations of five scalar/absence states against a separate decision oracle. UI JavaScript syntax was checked. Earlier browser checks covered the original interface; the updated table rendering, remote CI result and deployment of this fix have not yet been browser-verified. Mobile and 4K verification remain pending.

`test.mjs` checks domain outcomes and edge cases, deterministic behavior, input preservation, malformed roots, and size limits. GitHub Actions runs the same suite. Review the tests themselves to see exactly what is covered; passing these checks does not establish security or exhaustive correctness.

## Roadmap

- Add more independently reviewed domain fixtures and explicit schema documentation.
- Add domain-specific form controls alongside the JSON editor.
- Expand accessibility and mobile browser testing.
- Revisit the documented domain limitations before production use.

## Contribution and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [LICENSE](LICENSE).

© 2026 Puskar (Royalpuskar). All rights reserved except permissions granted by the MIT license. Preserve applicable third-party notices.
