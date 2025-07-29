import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"

interface useGetServerByIdProps {
    id : Id<"servers">
}

export const useGetServerById = ({id}:useGetServerByIdProps) =>{
    const data = useQuery(api.servers.getServerById,id ?{
        id
    }:"skip")
    const isLoading = data === undefined;

    return {data, isLoading}
}