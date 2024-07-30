import { ContextMenuCompProps } from 'src/types'

export default function ContextMenu({ items, x, y }: ContextMenuCompProps): JSX.Element {
  return (
    <ul
      style={{
        left: x,
        top: y,
        zIndex: '1000',
        backgroundColor: '',
        position: 'fixed'
      }}
    >
      {Object.entries(items).map(([label, action]) => (
        <li key={label} onClick={action} className="p-1 px-5">
          {label}
        </li>
      ))}
    </ul>
  )
}
