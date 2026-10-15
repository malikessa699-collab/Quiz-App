import Navbar from './Navbar';

function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <main className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', minHeight: '70vh' }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;