import { useContext } from "react"
import { ExplorerContextType } from "src/types"
import { ExplorerContext } from "@renderer/ctx/ExplorerContext"

export default function useExplorer(): ExplorerContextType {
	const context = useContext(ExplorerContext)
	if (context === undefined) {
		throw new Error ('useExplorer must be used within an ExplorerProvider')
	} else {
		return context
	}
}