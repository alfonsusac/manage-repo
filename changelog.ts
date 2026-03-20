export const changelog = {
  "0.0.22": {
    "date": "2026-03-19T13:28:07.764Z",
    "changes": [
      "Fix npm check fetch malformed message",
      "Added output log window",
      "Added non-pre-post script list in home screen",
      "Added handling for multiple processes",
      "WIP: Add Dependency",
    ]
  },

  "0.0.21": {
    "date": "2026-03-19T09:50:06.072Z",
    "changes": [
      "Improve front-end state management",
      "Change default port to 3200",
      "Add port increment if default port is in use",
      "Fixed dev being able to run twice on same server without killing the first one",
      "Improve error message on EADDRINUSE when trying to start dev server on a port that's already in use",
      "Fix not being able to open on vscode simpleBrowser on prod"
    ]
  },
  "0.0.20": {
    "date": "2026-03-19T03:29:06.309Z",
    "changes": [
      "Fixed package.json triggering hmr",
      "Fixed websocket not working"
    ]
  },
  "0.0.19": {
    "date": "2026-03-19T02:33:59.724Z",
    "changes": [
      "Fixed postpublish typo (by [@riskymh](https://github.com/RiskyMH))",
      "Updated package engine (by [@riskymh](https://github.com/RiskyMH))",
      "Updated postinstall script (by [@riskymh](https://github.com/RiskyMH))"
    ]
  },
  "0.0.18": {
    "date": "2026-03-19T02:15:02.853Z",
    "changes": [
      "Fix dependencies by moving deps to devdeps. (by [@riskymh](https://github.com/RiskyMH))"
    ]
  },
  "0.0.17": {
    "date": "2026-03-18T18:15:21.627Z",
    "changes": [
      "Fix package.json"
    ]
  },
  "0.0.16": {
    "date": "2026-03-18T18:14:26.126Z",
    "changes": [
      "Fix build not working"
    ]
  },
  "0.0.15": {
    "date": "2026-03-18T17:16:43.150Z",
    "changes": [
      "Fix css not working 3"
    ]
  },
  "0.0.14": {
    "date": "2026-03-18T17:13:30.996Z",
    "changes": [
      "Fix css not working 2"
    ]
  },
  "0.0.13": {
    "date": "2026-03-18T17:08:00.031Z",
    "changes": [
      "Fix css not working"
    ]
  },
  "0.0.12": {
    "date": "2026-03-18T16:28:30.423Z",
    "changes": [
      "Fix build process"
    ]
  },
  "0.0.11": {
    "date": "2026-03-18T16:25:16.487Z",
    "changes": [
      "Fix build process"
    ]
  },
  "0.0.10": {
    "date": "2026-03-18T15:06:35.013Z",
    "changes": [
      "Fix build process"
    ]
  },
  "0.0.9": {
    "date": "2026-03-18T13:09:49.325Z",
    "changes": [
      "Fix build process"
    ]
  },
  "0.0.8": {
    "date": "2026-03-18T11:16:59.299Z",
    "changes": [
      "Migrate from old repo to new one"
    ]
  },
  "0.0.7": {
    "date": "2026-03-16T17:22:38.728Z",
    "changes": [
      "Fix dependency issue"
    ]
  },
  "0.0.6": {
    "date": "2026-03-16T17:20:22.370Z",
    "changes": [
      "Test reading package.json from the host"
    ]
  },
  "0.0.5": {
    "date": "2026-03-16T15:43:32.588Z",
    "changes": [
      "Improve building and publishing process"
    ]
  }
} satisfies Record<string, {
    date: string,
    changes: string[],
  }>
