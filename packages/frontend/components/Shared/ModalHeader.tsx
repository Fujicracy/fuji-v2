import React from 'react';

import CloseButton from './CloseButton';
import ModalHeaderTitle from './ModalHeaderTitle';

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <>
      <CloseButton onClose={onClose} />
      <ModalHeaderTitle title={title} />
    </>
  );
}

export default ModalHeader;
