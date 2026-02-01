import type { FormItemProps } from 'antd/es/form';
import type { FC } from 'react';

import { Checkbox, DatePicker, Form, Input, InputNumber, Radio, Select, Switch } from 'antd';
import React, { useMemo } from 'react';

export type ControlTypes = 'input' | 'input-number' | 'switch' | 'date-picker' | 'checkbox' | 'radio' | 'select';

type GetRCPropsType<T> = T extends (props: infer R) => any ? R : T extends React.ComponentClass<infer R> ? R : any;

type InnerProps = {
  input: GetRCPropsType<typeof Input>;
  'input-number': GetRCPropsType<typeof InputNumber>;
  switch: GetRCPropsType<typeof Switch>;
  'date-picker': GetRCPropsType<typeof DatePicker>;
  checkbox: GetRCPropsType<typeof Checkbox>;
  radio: GetRCPropsType<typeof Radio>;
  select: GetRCPropsType<typeof Select>;
};

export interface MyFormItemProps<T extends ControlTypes = ControlTypes> extends Omit<FormItemProps, 'required'> {
  type?: T;
  /** options for controls like select/checkbox/radio (optional) **/
  options?: {
    label: string;
    value: any;
    disabled?: boolean;
  }[];
  /** inner props for the control (optional) **/
  innerProps?: InnerProps[T];
  required?: string | boolean;
}

export class ControlMap {
  props: MyFormItemProps;

  constructor(props: MyFormItemProps) {
    this.props = props;
  }

  get innerProps() {
    return this.props.innerProps as object;
  }

  input() {
    return <Input {...this.innerProps} />;
  }

  'input-number'() {
    return <InputNumber {...this.innerProps} />;
  }

  switch() {
    return <Switch {...this.innerProps} />;
  }

  'date-picker'() {
    return <DatePicker {...this.innerProps} />;
  }

  checkbox() {
    // highlight-next-line
    return <Checkbox.Group children={this.props.children} options={this.props.options} {...this.innerProps} />;
  }

  radio() {
    // highlight-next-line
    return <Radio.Group children={this.props.children} options={this.props.options} {...this.innerProps} />;
  }

  select() {
    // highlight-next-line
    return <Select children={this.props.children} options={this.props.options} {...this.innerProps} />;
  }
}

const MyformItem: FC<MyFormItemProps> = props => {
  // pick custom props; pass the rest to `Form.Item`
  // type: determines which control to render
  // children: custom children for `Form.Item`
  const { type, required, rules: userRules, ...restProps } = props;

  const rules = useMemo(() => {
    // if user provided rules, use them as-is
    if (userRules) return userRules;

    // if required is set, build a simple required rule
    if (required) {
      if (typeof required === 'boolean') {
        return [{ required: true, message: `Informe ${props.label}` }];
      }
      // custom required message
      else if (typeof required === 'string') {
        return [{ required: true, message: required }];
      }
    }
  }, [required, userRules, props.label]);

  // highlight-next-line
  const controlMap = new ControlMap(props);

  return (
    <Form.Item {...restProps} rules={rules}>
      {type ? controlMap[type]() : props.children}
    </Form.Item>
  );
};

export default MyformItem;
