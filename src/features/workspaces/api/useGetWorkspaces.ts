import { useQuery } from "convex/react";

import {api} from "../../../../convex/_generated/api"

export const useGetWorkspaces = () => {
    const workspaceData = useQuery(api.workspaces.getWorkspaces);
    const isLoading = workspaceData === undefined;

    return {workspaceData, isLoading}
}