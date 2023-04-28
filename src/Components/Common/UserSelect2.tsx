import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { getUserList } from "../../Redux/actions";
import { LegacyAutoCompleteAsyncField } from "../Common/HelperInputFields";
import { UserModel } from "../Users/models";
import { debounce } from "lodash";
interface UserSelectProps {
  name?: string | "";
  margin?: string;
  errors: string;
  className?: string;
  multiple?: boolean;
  selected: UserModel | UserModel[] | null;
  setSelected: (selected: UserModel | UserModel[] | null) => void;
}

export const UserSelect = (props: UserSelectProps) => {
  const {
    name,
    multiple,
    selected,
    setSelected,
    margin,
    errors,
    className = "",
  } = props;
  const dispatchAction: any = useDispatch();
  const [userLoading, isUserLoading] = useState(false);
  const [hasSearchText, setHasSearchText] = useState(false);
  const [UserList, setUserList] = useState<Array<UserModel>>([]);

  const getPersonName = (user: any) => {
    const personName = user.first_name + " " + user.last_name;

    return personName.trim().length > 0 ? personName : user.username;
  };

  const handleValueChange = (current: UserModel | UserModel[] | null) => {
    if (!current) {
      setUserList([]);
      isUserLoading(false);
      setHasSearchText(false);
    }
    setSelected(current);
  };

  const handelSearch = (e: any) => {
    isUserLoading(true);
    setHasSearchText(!!e.target.value);
    onUserSearch(e.target.value);
  };

  const onUserSearch = useCallback(
    debounce(async (text: string) => {
      if (text) {
        const params = {
          limit: 50,
          offset: 0,
          search_text: text,
        };

        const res = await dispatchAction(getUserList(params));

        if (res && res.data) {
          setUserList(res.data.results);
        }
        isUserLoading(false);
      } else {
        setUserList([]);
        isUserLoading(false);
      }
    }, 300),
    []
  );

  return (
    <LegacyAutoCompleteAsyncField
      name={name}
      multiple={multiple}
      variant="outlined"
      margin={margin}
      value={selected}
      options={UserList}
      onSearch={handelSearch}
      onChange={(e: any, selected: any) => handleValueChange(selected)}
      loading={userLoading}
      placeholder="Search by name or username"
      noOptionsText={
        hasSearchText
          ? "No user found, please try again"
          : "Start typing to begin search"
      }
      renderOption={(option: any) => (
        <div className="flex items-center space-x-3">
          <span className="font-normal block truncate">
            {getPersonName(option)} - ({option.user_type})
          </span>
        </div>
      )}
      getOptionSelected={(option: any, value: any) => option.id === value.id}
      getOptionLabel={(option: any) =>
        `${getPersonName(option)} - (${option.user_type})`
      }
      filterOptions={(options: UserModel[]) => options}
      errors={errors}
      className={className}
    />
  );
};
