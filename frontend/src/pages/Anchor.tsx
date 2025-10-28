
import { useParams } from 'react-router-dom'

import { AnchorView } from '../components/AnchorView'

export function AnchorPage() {
  const { anchorId } = useParams<{ anchorId: string }>()

  if (!anchorId) {
    return (
      <div className="page-container">
        <h1>No anchor selected</h1>
      </div>
    )
  }

  return <AnchorView anchorId={anchorId} />
}
