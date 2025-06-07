# Contributing / Extension development

## Locally Develop this Extension

1. **Clone repo**

    ```bash
    git clone https://github.com/PoffM/ui-test-visualizer.git
    cd ui-test-visualizer
    ```

1. **Install dependencies**

    ```bash
    pnpm install
    ```

1. **Start the development server**

    ```bash
    pnpm dev
    ```

    Starts the tsup and Vite dev servers.

1. **Launch the extension in VSCode**

   Go to the Run panel (`Ctrl+Shift+D`) and choose one of the example projects to run.

## Running Tests

### Unit+Integration Tests

The integration tests in compat.test.ts are run against the built extension, so you'll need to build the extension first.

```bash
pnpm build # Only needed for compat.test.ts
```

```bash
pnpm test
```

### E2E Tests (Playwright)

```bash
pnpm test:e2e
```

## Publishing and Changelogs

This repo uses [Changesets](https://github.com/changesets/changesets) to manage versioning + changelogs + publishing.

To add a changeset (to update the CHANGELOG.md), run the following:

```bash
pnpm changeset
```

Follow the prompts to describe the changeset.

Changesets' GitHub Action will automatically create a pull request with the changeset, update CHANGELOG.md, and publish the new version to VSCode Marketplace when the pull request is merged.
