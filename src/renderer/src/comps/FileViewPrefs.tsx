import useContextMenu from "@renderer/hooks/useContextMenu"
import ContextMenu from "./ContextMenu"

export default function FileViewPrefs(): JSX.Element {
	const { contextMenuProps, showContextMenu } = useContextMenu()

	return <div onContextMenu={(e) => showContextMenu(e)} className="w-full h-[10%] border-white border-2 border-solid">hello from FileViewPrefs</div>
}