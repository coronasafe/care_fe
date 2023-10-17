import { useState } from "react";
import * as Notification from "../../Utils/Notifications.js";
import { formatDateTime } from "../../Utils/utils";
import CircularProgress from "../Common/components/CircularProgress";
import ButtonV2 from "../Common/components/ButtonV2";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import PaginatedList from "../../CAREUI/misc/PaginatedList";
import { IComment } from "./models";
import request from "../../Utils/request/request";

const CommentSection = (props: { id: string }) => {
  const [commentBox, setCommentBox] = useState("");
  const offset = 0;
  const limit = 8;

  const { loading, refetch: resourceRefetch } = useQuery(
    routes.getResourceComments,
    {
      pathParams: { id: props.id },
      query: { limit, offset },
    }
  );

  const onSubmitComment = async () => {
    const payload = {
      comment: commentBox,
    };
    if (!/\S+/.test(commentBox)) {
      Notification.Error({
        msg: "Comment Should Contain At Least 1 Character",
      });
      return;
    }

    const { res, data } = await request(routes.addResourceComments, {
      pathParams: { id: props.id },
      body: payload,
    });
    if (res && data) {
      Notification.Success({ msg: "Comment added successfully" });
      resourceRefetch();
    }
    setCommentBox("");
  };

  return (
    <div className="flex w-full flex-col">
      <TextAreaFormField
        name="comment"
        placeholder="Type your comment"
        value={commentBox}
        onChange={(e) => setCommentBox(e.value)}
      />
      <div className="flex w-full justify-end">
        <ButtonV2 onClick={onSubmitComment}>Post Your Comment</ButtonV2>
      </div>
      <div className="w-full">
        {loading ? (
          <CircularProgress className="h-12 w-12" />
        ) : (
          <PaginatedList
            route={routes.getResourceComments}
            pathParams={{ id: props.id }}
          >
            {() => (
              <div>
                <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
                  <span>No comments available</span>
                </PaginatedList.WhenEmpty>
                <PaginatedList.WhenLoading>
                  <CircularProgress className="h-12 w-12" />
                </PaginatedList.WhenLoading>
                <PaginatedList.Items<IComment>>
                  {(item) => <Comment {...item} />}
                </PaginatedList.Items>
                <div className="flex w-full items-center justify-center">
                  <PaginatedList.Paginator hideIfSinglePage />
                </div>
              </div>
            )}
          </PaginatedList>
        )}
      </div>
    </div>
  );
};

export default CommentSection;

export const Comment = ({
  comment,
  created_by_object,
  modified_date,
}: IComment) => (
  <div className="mt-4 flex w-full flex-col rounded-lg border border-gray-300 bg-white p-4 text-gray-800">
    <div className="flex  w-full ">
      <p className="text-justify">{comment}</p>
    </div>
    <div className="mt-3">
      <span className="text-xs text-gray-500">
        {formatDateTime(modified_date) || "-"}
      </span>
    </div>
    <div className=" mr-auto flex items-center rounded-md border bg-gray-100 py-1 pl-2 pr-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 p-1 uppercase text-white">
        {created_by_object?.first_name?.charAt(0) || "U"}
      </div>
      <span className="pl-2 text-sm text-gray-700">
        {created_by_object?.first_name || "Unknown"}{" "}
        {created_by_object?.last_name}
      </span>
    </div>
  </div>
);
