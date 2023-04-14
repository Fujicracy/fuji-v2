import 'react-toastify/dist/ReactToastify.min.css';

import { ToastContainer } from 'react-toastify';

/** Custom component for notifications. */
function Notification() {
  /** Describes notification queue */
  const IS_NEWEST_ON_TOP = false;
  /** Describes behavior closes notification by onClick Mouse Event */
  const IS_CLOSED_ON_CLICK = false;
  /** Max number of notifications */
  const LIMIT = 5;

  return (
    <ToastContainer
      newestOnTop={IS_NEWEST_ON_TOP}
      closeOnClick={IS_CLOSED_ON_CLICK}
      limit={LIMIT}
      rtl={false}
      hideProgressBar
      pauseOnFocusLoss
      pauseOnHover
    />
  );
}

export default Notification;
