import { Text, TextInput, View, type TextInputProps } from "react-native";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, ...props }: TextFieldProps) {
  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityState={{ disabled: props.editable === false }}
        placeholderTextColor="#64748b"
        className={`min-h-[56px] rounded-xl border bg-white px-4 text-base text-slate-900 dark:bg-slate-900 dark:text-slate-100 ${
          error ? "border-red-500" : "border-slate-300 dark:border-slate-700"
        }`}
        {...props}
      />
      {error ? (
        <Text className="mt-1 text-sm text-red-600">{error}</Text>
      ) : null}
    </View>
  );
}
