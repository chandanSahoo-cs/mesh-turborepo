import { useQuery } from "convex/react";

import {api} from "../../../../convex/_generated/api"

export const useGetServers = () => {
    const serverData = useQuery(api.servers.getServers);
    const isLoading = serverData === undefined;

    return {serverData, isLoading}
}