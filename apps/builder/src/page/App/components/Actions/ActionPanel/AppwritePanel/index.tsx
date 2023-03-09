import { FC, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDispatch, useSelector } from "react-redux"
import { BuilderApi } from "@/api/base"
import { ActionEventHandler } from "@/page/App/components/Actions/ActionPanel/ActionEventHandler"
import { DocumentSubPanel } from "@/page/App/components/Actions/ActionPanel/AppwritePanel/DocumentSubPanel"
import { ListDocumentsSubPanel } from "@/page/App/components/Actions/ActionPanel/AppwritePanel/ListDocuments"
import { ResourceChoose } from "@/page/App/components/Actions/ActionPanel/ResourceChoose"
import { SingleTypeComponent } from "@/page/App/components/Actions/ActionPanel/SingleTypeComponent"
import {
  actionItemContainer,
  panelContainerStyle,
} from "@/page/App/components/Actions/ActionPanel/style"
import {
  getCachedAction,
  getSelectedAction,
} from "@/redux/config/configSelector"
import { configActions } from "@/redux/config/configSlice"
import { ActionItem } from "@/redux/currentApp/action/actionState"
import {
  AppwriteAction,
  AppwriteActionMethodsOptions,
  AppwriteActionMethodsType,
  AppwriteActionTypes,
  DocumentOperationsInitial,
  ListDocumentsInitial,
} from "@/redux/currentApp/action/appwriteAction"
import { ResourcesData } from "@/redux/resource/resourceState"

const AppwriteSubComponentMap = {
  get: DocumentSubPanel,
  create: DocumentSubPanel,
  update: DocumentSubPanel,
  delete: DocumentSubPanel,
  list: ListDocumentsSubPanel,
}

export const AppwritePanel: FC = () => {
  const { t } = useTranslation()
  const cachedAction = useSelector(getCachedAction) as ActionItem<
    AppwriteAction<AppwriteActionTypes>
  >
  const selectedAction = useSelector(getSelectedAction) as ActionItem<
    AppwriteAction<AppwriteActionTypes>
  >
  const content = cachedAction.content
  const selectedContent = selectedAction.content
  const dispatch = useDispatch()
  const [collectionIds, setCollectionIds] = useState<string[]>([])

  useEffect(() => {
    BuilderApi.teamRequest(
      {
        url: `/resources/${cachedAction.resourceId}/meta`,
        method: "GET",
      },
      ({ data }: { data: ResourcesData }) => {
        const ids = ((data.schema.collections as []) ?? []).map(
          (item: { id: string }) => item.id,
        )
        setCollectionIds(ids)
      },
      () => {},
      () => {},
      () => {},
    )
  }, [cachedAction.resourceId])

  const handleMethodValueChange = useCallback(
    (value: AppwriteActionMethodsType) => {
      const newContent =
        selectedContent.method === value
          ? selectedContent
          : {
              opts:
                value === "list"
                  ? ListDocumentsInitial
                  : DocumentOperationsInitial,
              method: value,
            }
      dispatch(
        configActions.updateCachedAction({
          ...cachedAction,
          content: newContent,
        }),
      )
    },
    [cachedAction, content, dispatch, selectedContent],
  )

  const handleValueChange = useCallback(
    (param: string) => (value: string | Record<string, string>[]) => {
      dispatch(
        configActions.updateCachedAction({
          ...cachedAction,
          content: {
            ...content,
            opts: {
              ...content.opts,
              [param]: value,
            },
          },
        }),
      )
    },
    [cachedAction, content, dispatch],
  )

  const Component = AppwriteSubComponentMap[content.method]
  const withDataEditor = !["get", "delete"].includes(content.method)

  return (
    <div css={panelContainerStyle}>
      <ResourceChoose />
      <div css={actionItemContainer}>
        <SingleTypeComponent
          componentType="select"
          onChange={handleMethodValueChange}
          value={content.method}
          options={AppwriteActionMethodsOptions}
          title={"Method"}
        />
        <Component
          key={content.method}
          handleValueChange={handleValueChange}
          withDataEditor={withDataEditor}
          params={content.opts}
          collectionIds={collectionIds}
        />
      </div>
      <ActionEventHandler />
    </div>
  )
}
AppwritePanel.displayName = "AppwritePanel"