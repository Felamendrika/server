import { createPortal } from 'react-dom';

const Modal = ({ children }) => {
  return createPortal(
    children,
    document.getElementById('modal-root')
  );
};

export default Modal;
