import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"

interface useGetWorkspaceByIdProps {
    id : Id<"workspace">
}

export const useGetWorkspaceById = ({id}:useGetWorkspaceByIdProps) =>{
    const data = useQuery(api.workspaces.getWorkspaceById,{
        id
    })
    const isLoading = data === undefined;

    return {data, isLoading}
}