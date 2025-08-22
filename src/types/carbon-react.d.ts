declare module 'carbon-react/lib' {
  import { ComponentType, ReactNode } from 'react';

  export interface ButtonProps {
    children?: ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    variant?: 'primary' | 'secondary' | 'tertiary';
    'aria-label'?: string;
    title?: string;
  }

  export interface IconButtonProps {
    children?: ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    'aria-label'?: string;
  }

  export interface TextboxProps {
    label?: string;
    placeholder?: string;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    labelWidth?: string;
    size?: 'small' | 'medium' | 'large';
  }

  export interface SelectProps {
    label?: string;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    labelWidth?: string;
    size?: 'small' | 'medium' | 'large';
    labelInline?: boolean;
    'aria-label'?: string;
    children?: ReactNode;
  }

  export interface OptionProps {
    value: string;
    text: string;
  }

  export interface ModalProps {
    open?: boolean;
    onCancel?: () => void;
    title?: string;
    subtitle?: string;
    size?: 'small' | 'medium' | 'large' | 'xlarge';
    children?: ReactNode;
  }

  export interface ModalBodyProps {
    children?: ReactNode;
    ref?: React.RefObject<HTMLDivElement>;
  }

  export interface ModalHeaderProps {
    children?: ReactNode;
  }

  export interface FlatTableProps {
    children?: ReactNode;
  }

  export interface FlatTableHeadProps {
    children?: ReactNode;
  }

  export interface FlatTableHeaderProps {
    children?: ReactNode;
  }

  export interface FlatTableBodyProps {
    children?: ReactNode;
  }

  export interface FlatTableRowProps {
    children?: ReactNode;
  }

  export interface FlatTableCellProps {
    children?: ReactNode;
  }

  export const Button: ComponentType<ButtonProps>;
  export const IconButton: ComponentType<IconButtonProps>;
  export const Textbox: ComponentType<TextboxProps>;
  export const Select: ComponentType<SelectProps>;
  export const Option: ComponentType<OptionProps>;
  export const Modal: ComponentType<ModalProps>;
  export const ModalBody: ComponentType<ModalBodyProps>;
  export const ModalHeader: ComponentType<ModalHeaderProps>;
  export const FlatTable: ComponentType<FlatTableProps>;
  export const FlatTableHead: ComponentType<FlatTableHeadProps>;
  export const FlatTableHeader: ComponentType<FlatTableHeaderProps>;
  export const FlatTableBody: ComponentType<FlatTableBodyProps>;
  export const FlatTableRow: ComponentType<FlatTableRowProps>;
  export const FlatTableCell: ComponentType<FlatTableCellProps>;
  export const CarbonProvider: ComponentType<{ children?: ReactNode }>;
  export const GlobalStyle: ComponentType<{}>;
}

declare module 'carbon-react/lib/icons' {
  import { ComponentType } from 'react';
  
  export const Close: ComponentType<{}>;
}