import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { channelService } from "../../services/ChannelService";

// Resolves "/c/:communityId" to the community's first channel so the rail can
// link to a community without knowing its channels.
const CommunityRedirect: React.FC = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!communityId) return;
    let active = true;
    (async () => {
      try {
        const channels = await channelService.list(communityId);
        if (active && channels.length) {
          navigate(`/c/${communityId}/${channels[0]._id}`, { replace: true });
        } else if (active) {
          navigate("/", { replace: true });
        }
      } catch {
        if (active) navigate("/", { replace: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [communityId, navigate]);

  return null;
};

export default CommunityRedirect;
