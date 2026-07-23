import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/attachments')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/attachments"!</div>
}
