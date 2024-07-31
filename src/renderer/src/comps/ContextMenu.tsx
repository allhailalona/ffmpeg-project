import useContextMenu from '@renderer/hooks/useContextMenu'

//react passes props between comps as objects, in this case, it's {x: value, y: value}, which is why we--
//--need to annotate them as objects, and not as x: number, y: number
export default function ContextMenu({ x, y }: { x: number; y: number }): JSX.Element {
  const { options } = useContextMenu()

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
      {Object.entries(options).map(([label, action]) => (
        <li key={label} onClick={action} className="p-1 px-5 bg-yellow-400">
          {label}
        </li>
      ))}
    </ul>
  )
}
