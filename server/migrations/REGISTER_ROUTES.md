# Register POS Routes in Your Express App

In your server/src/app.ts (or index.ts), add:

```typescript
import posRoutes from './routes/posRoutes'

// Add this line alongside your existing routes:
app.use('/api/pos', posRoutes)
```

That's it. Your existing routes are untouched.
