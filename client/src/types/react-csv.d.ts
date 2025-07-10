declare module 'react-csv' {
  import { ComponentType, ReactNode } from 'react';

  interface CSVProps {
    data: Array<any>;
    headers?: Array<any>;
    target?: string;
    separator?: string;
    filename?: string;
    uFEFF?: boolean;
    enclosingCharacter?: string;
    className?: string;
    style?: object;
    children?: ReactNode;
    onClick?: () => void;
  }

  export const CSVLink: ComponentType<CSVProps>;
  export const CSVDownload: ComponentType<CSVProps>;
}