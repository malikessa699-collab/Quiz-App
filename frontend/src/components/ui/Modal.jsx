function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
        <div>{children}</div>
        {footer && <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;