Version: v1.1.2
Saved at: 2026-03-22

This snapshot preserves the stable web deployment version after:
- the project was successfully deployed on Render
- the public HTTPS domain became available
- the server switched to prefer Node built-in sqlite on Render
- the web ordering flow, admin login protection, SQLite storage, and uploads flow were all working

Current public domain at the time of snapshot:
- https://menu-order-app.onrender.com

Key deployment commit:
- 369666f Use built-in node sqlite for Render deploy

Restore this snapshot if we need to roll back to the stable web version later.
