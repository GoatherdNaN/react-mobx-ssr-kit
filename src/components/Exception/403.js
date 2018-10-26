import React from 'react';
import { Link } from 'react-router-dom';
import Exception from './index';

export default () => (
  <Exception type="403" style={{ minHeight: 500, height: '80%' }} linkElement={Link} />
);
