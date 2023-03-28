import 'react-toastify/dist/ReactToastify.min.css';

import { ToastContainer, ToastPosition } from 'react-toastify';

/** Custom component for notifications. */
function Notification() {
  /** Describes notification position */
  const POSITION: ToastPosition = 'top-right';
  /** Closes notification after delay  */
  const AUTO_CLOSE_TIME = 500000;
  /** Describes notification queue */
  const IS_NEWEST_ON_TOP = false;
  /** Describes behaviour closes notification by onClick Mouse Event */
  const IS_CLOSED_ON_CLICK = false;

  return (
    <ToastContainer
      position={POSITION}
      autoClose={AUTO_CLOSE_TIME}
      hideProgressBar
      newestOnTop={IS_NEWEST_ON_TOP}
      closeOnClick={IS_CLOSED_ON_CLICK}
      rtl={false}
      pauseOnFocusLoss
      pauseOnHover
    />
  );
}

export default Notification;
