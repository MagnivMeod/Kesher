# המוזיאון שלנו

A private 3D museum for two: walk around a night gallery, see each other live, send hearts.

- `index.html` – the whole game (three.js 0.160 from jsDelivr).
- `photos/` – the six framed photos. **Not committed** (this repo is public); they ship only inside the private artifact page.
- Live multiplayer uses the claude.ai artifact `room` capability (presence only), so it works when the page is opened as a shared artifact.
- Entry code is checked against a SHA-256 hash; it is a front-door lock, not real security. Access is controlled by artifact sharing.
