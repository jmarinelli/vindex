/dashboard
- when going offline with the dashboard already rendered, i'm seeing a lot of draft inspections that were actually already signed (but were kept as draft in dexie)...what should we do about drafts when they're signed? or are we already deleting them but dexie data in this specific browser is corrupt/old?
- when navigating to the dashboard in offline mode, i see the app shell (header and empty content) but i get a ton of console errors due to connectivy issues:
    - inspection.ts:142  POST http://localhost:3000/dashboard net::ERR_INTERNET_DISCONNECTED
    - web-socket.ts:50 WebSocket connection to 'ws://localhost:3000/_next/webpack-hmr?id=QTZVHhipO1ipSoo0vsrP9' failed: 
    - layout.tsx:28  GET http://localhost:3000/api/auth/session net::ERR_INTERNET_DISCONNECTED
    - ClientFetchError: Failed to fetch. Read more at https://errors.authjs.dev#autherror
    at fetchData (client.js:39:22)
    at async getSession (react.js:103:21)
    at async SessionProvider.useEffect (react.js:251:43)
    - manifest.json:1  GET http://localhost:3000/manifest.json net::ERR_INTERNET_DISCONNECTED
    - you get the picture
- on a regular online load i get this console error:
    - Uncaught Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:
        - A server/client branch `if (typeof window !== 'undefined')`.
        - Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
        - Date formatting in a user's locale which doesn't match the server.
        - External changing data without sending a snapshot of it along with the HTML.
        - Invalid HTML tag nesting.

        It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

        https://react.dev/link/hydration-mismatch


/dashboard/inspect/[id]
- shows offline.html when navigating offline...doesn't even render the shell