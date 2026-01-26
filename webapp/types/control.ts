import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type MessageProcessor from "sap/ui/core/message/MessageProcessor";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type SimpleType from "sap/ui/model/SimpleType";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type { Dict } from "./utils";

// CompositeBindingInfo describes how a UI5 property gets its value.
// It can come from:
// - a single binding (PropertyBindingInfo)
// - or multiple bindings combined (parts[])
export type CompositeBindingInfo = PropertyBindingInfo & {
  // The actual binding object created by UI5 (optional)
  // Usually UI5 fills this automatically after binding is applied.
  binding?: PropertyBinding;

  // For composite binding: list of individual bindings that
  // will be combined together (each is its own PropertyBindingInfo)
  parts?: PropertyBindingInfo[];
};


// BindingContextInfoTarget describes everything needed to bind ONE control
// to a model path (usually for forms or editors).
export interface BindingContextInfoTarget<C extends Control, T extends Dict> {

  // Name used to identify this binding (your own reference name)
  name: string;

  // The model path to bind to (e.g. "/Employee/Name")
  path: string;

  // Optional: message processor for validation / error messages
  processor?: MessageProcessor;

  // Optional: type object to convert/format the bound value
  // (e.g. sap.ui.model.type.Date, Integer, Boolean)
  bindingType?: SimpleType;

  // The binding instance once UI5 creates it
  binding?: PropertyBinding;

  // The JSON model used for the binding
  model: JSONModel;

  // If using named models, this specifies which one ("" = default model)
  modelName: string;

  // Label shown in the UI (used for forms, error messages, etc.)
  label: string;

  // The UI5 control being bound (Input, DatePicker, Select, etc.)
  control: C;

  // The property on the control being bound (e.g. "value", "selectedKey")
  target: string;

  // Extra metadata you want to attach (anything you need later)
  data: T;
}
