function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }}
    >
      <div className="spinner" />
      <p className="text-muted">{label}</p>
    </div>
  );
}

export default LoadingScreen;