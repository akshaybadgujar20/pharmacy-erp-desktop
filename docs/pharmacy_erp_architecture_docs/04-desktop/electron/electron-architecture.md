# Electron Architecture

> Source: Original Architecture Handbook

Renderer

Runs Angular

Never expose Node directly.

Main Process

Responsible for

- Printing
- File System
- Window Management
- Auto Updates

Use **Context Isolation** and a **Preload Script** with `contextBridge` to expose only the APIs Angular needs.

---
