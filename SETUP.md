# Setup

## 1. Create your GitHub Profile repository

Your profile repository **must have exactly the same name as your GitHub username**:

```text
vgduchieu0602/vgduchieu0602
```

Make it **Public** and initialize it with a README.

## 2. Copy these files

```text
vgduchieu0602/
├─ README.md
├─ assets/
├─ scripts/
│  └─ update-metrics.js
└─ .github/
   └─ workflows/
      └─ update-profile.yml
```

## 3. Push

```bash
git add .
git commit -m "feat(profile): build dynamic GitHub profile"
git push
```

## 4. Run the workflow once

Open:

```text
GitHub → your profile repo → Actions → Update Profile Visuals → Run workflow
```

The workflow will generate:

```text
assets/metrics.svg
assets/github-snake.svg
assets/github-snake-dark.svg
```

and commit them back automatically.

## 5. Repository permissions

If GitHub blocks the workflow from pushing, check:

```text
Settings
→ Actions
→ General
→ Workflow permissions
→ Read and write permissions
```

The workflow already declares:

```yaml
permissions:
  contents: write
```

## Customization ideas

- Replace public featured repositories with your strongest public work.
- Add your portfolio URL when it is deployed.
- Add LinkedIn/email only if you want them publicly visible.
- Keep the first screen concise: recruiter should understand your direction in under 10 seconds.
- Avoid adding too many third-party stat cards. Your own generated SVG is more distinctive and less dependent on external services.
