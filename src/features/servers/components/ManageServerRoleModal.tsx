import { useManageServerRoleModal } from "../store/useManageServerRoleModal"

export const ManageServerRoleModal = () => {
    const {isOpen, setIsOpen} = useManageServerRoleModal()
    return (
        <div>
            ServerRole
        </div>
    )
}