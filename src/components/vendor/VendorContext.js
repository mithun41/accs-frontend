'use client';

import { createContext, useContext } from 'react';

export const VendorContext = createContext({ shop: null, reloadShop: () => {} });
export const useVendor = () => useContext(VendorContext);
