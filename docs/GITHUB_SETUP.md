# GitHub Release CI Setup (Windows + Android)

This project uses one primary release workflow:

- `.github/workflows/release.yml` -> automatic on git tags matching `v*`
- `.github/workflows/tauri-build.yml` -> legacy manual backup (`workflow_dispatch` only)

## Required GitHub Secrets

### Android signing (required for signed release APK)

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

If these Android secrets are missing, CI now falls back to building a **debug APK** so release generation does not stop.

### Windows signing (optional)

- `WINDOWS_PFX`
- `WINDOWS_PFX_PASSWORD`

If Windows signing secrets are missing, the workflow still builds Windows installers and skips signing.

## Release Trigger

Use semantic version tags:

```bash
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

Any tag starting with `v` triggers the unified workflow.

## CI Contracts

- Dependencies are installed with `npm ci`.
- `package-lock.json` must exist in the repository.
- Android build expects a release keystore from secrets.
- Release job publishes both:
  - Windows installer files (`*.exe`)
  - Android APK files (`*.apk`)

## Troubleshooting

### Android signing fails

- Confirm all four Android secrets are configured.
- Ensure the keystore alias/password match the actual keystore.
- Check the `Validate Android signing secrets` step in workflow logs.

### APK verification fails

- Confirm an APK was produced under `src-tauri/gen/android/app/build/outputs`.
- Check the `Verify APK signature` step output.

### Windows signing fails

- Confirm `WINDOWS_PFX` is Base64-encoded PFX content.
- Confirm `WINDOWS_PFX_PASSWORD` is correct.
- Check if `signtool` is available on the runner.

### `npm ci` fails

- Ensure `package-lock.json` is present and committed.
- Regenerate lockfile locally if needed, then commit:

```bash
npm install
git add package-lock.json
git commit -m "chore: refresh package-lock.json"
```
