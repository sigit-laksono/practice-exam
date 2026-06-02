export default function OptionButton({ label, text, selected, multi, onChange }) {
  const Tag = multi ? 'label' : 'label'

  return (
    <Tag
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-900'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <input
        type={multi ? 'checkbox' : 'radio'}
        checked={selected}
        onChange={onChange}
        className="mt-0.5 accent-blue-600"
      />
      <span>
        <span className="font-semibold">{label}.</span> {text}
      </span>
    </Tag>
  )
}
