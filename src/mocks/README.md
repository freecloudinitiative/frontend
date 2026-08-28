# Mock request contracts

Every mutating JSON mock handler must mirror `platform-common/httpx.DecodeJSON`'s
unknown-field behavior. Payload keys that the real service would reject must
return HTTP 400 with the `invalid_input` error envelope in MSW as well.

When a field is added, update the authoritative Go input struct or service
whitelist first, then add the same key to the handler's allowed-key array.
Never update the mock contract before the backend contract.
