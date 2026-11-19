import { ActionIcon } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'

export function DeleteButton(props: { onClick: () => void }) {
  return (
    <ActionIcon size="lg" variant="subtle" color="red" onClick={props.onClick}>
      <IconTrash size={20} />
    </ActionIcon>
  )
}
