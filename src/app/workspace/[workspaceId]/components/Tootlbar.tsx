import { Button } from "@/components/ui/button";
import { useGetWorkspaceById } from "@/features/workspaces/api/useGetWorkspaceById";
import { useWorkspaceId } from "@/hooks/useWorkspaceId";
import { InfoIcon, SearchIcon } from "lucide-react";

interface ToolbarProps {}
export const Toolbar = ({}: ToolbarProps) => {

    const workspaceId = useWorkspaceId();
    const {data , isLoading} = useGetWorkspaceById({id:workspaceId})

  return (
    <div className="bg-[#481349] flex items-center justify-between h-10 p-1.5">
      <div className="flex-1" />
      <div className="min-w-[280px] max-[642px] grow-[2] shrink">
        <Button
          size="sm"
          className="bg-accent/25 hover:bg-accent-25 w-full justify-start h-7 px-2">
          <SearchIcon className="size-4 text-white mr-2" />
          <span className="text-white text-xs">Search {data?.name}</span>
        </Button>
      </div>
      <div className="ml-auto flex-1 flex items-center justify-end">
        <Button variant="transparent">
            <InfoIcon className="size-5 text-white"/>
        </Button>
      </div>
    </div>
  );
};
