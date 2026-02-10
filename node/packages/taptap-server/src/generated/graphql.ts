import type { GraphQLResolveInfo } from "graphql";
import type { Context } from "../context/index.js";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type GQLMutation = {
  __typename?: "Mutation";
  sendNotification: GQLSendNotificationResult;
};

export type GQLMutationSendNotificationArgs = {
  input: GQLSendNotificationInput;
};

export type GQLNotificationRecipientInput = {
  email: Scalars["String"]["input"];
  id: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
};

export type GQLNotificationType =
  | "ACCOUNT_WARNING"
  | "AUCTION_ENDING_SOON"
  | "AUCTION_WON"
  | "ITEM_APPROVED"
  | "ITEM_REMOVED"
  | "ITEM_SOLD"
  | "NEW_BID_ON_YOUR_ITEM"
  | "NEW_DIRECT_MESSAGE"
  | "NEW_FOLLOWER"
  | "NEW_ITEM_CHAT_MESSAGE"
  | "NEW_REVIEW"
  | "OUTBID"
  | "PURCHASE_CONFIRMED"
  | "SAVED_SEARCH_MATCH"
  | "VERIFICATION_APPROVED"
  | "VOUCHED_FOR_YOU"
  | "WATCHED_ITEM_ENDING_SOON"
  | "WATCHED_ITEM_PRICE_DROP";

export type GQLQuery = {
  __typename?: "Query";
  health: Scalars["String"]["output"];
};

export type GQLSendNotificationInput = {
  data: Scalars["String"]["input"];
  recipient: GQLNotificationRecipientInput;
  type: GQLNotificationType;
};

export type GQLSendNotificationResult = {
  __typename?: "SendNotificationResult";
  error: Maybe<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {},
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type GQLResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  Mutation: ResolverTypeWrapper<{}>;
  NotificationRecipientInput: GQLNotificationRecipientInput;
  NotificationType: GQLNotificationType;
  Query: ResolverTypeWrapper<{}>;
  SendNotificationInput: GQLSendNotificationInput;
  SendNotificationResult: ResolverTypeWrapper<GQLSendNotificationResult>;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type GQLResolversParentTypes = ResolversObject<{
  Boolean: Scalars["Boolean"]["output"];
  Mutation: {};
  NotificationRecipientInput: GQLNotificationRecipientInput;
  Query: {};
  SendNotificationInput: GQLSendNotificationInput;
  SendNotificationResult: GQLSendNotificationResult;
  String: Scalars["String"]["output"];
}>;

export type GQLMutationResolvers<
  ContextType = Context,
  ParentType extends GQLResolversParentTypes["Mutation"] =
    GQLResolversParentTypes["Mutation"],
> = ResolversObject<{
  sendNotification?: Resolver<
    GQLResolversTypes["SendNotificationResult"],
    ParentType,
    ContextType,
    RequireFields<GQLMutationSendNotificationArgs, "input">
  >;
}>;

export type GQLQueryResolvers<
  ContextType = Context,
  ParentType extends GQLResolversParentTypes["Query"] =
    GQLResolversParentTypes["Query"],
> = ResolversObject<{
  health?: Resolver<GQLResolversTypes["String"], ParentType, ContextType>;
}>;

export type GQLSendNotificationResultResolvers<
  ContextType = Context,
  ParentType extends GQLResolversParentTypes["SendNotificationResult"] =
    GQLResolversParentTypes["SendNotificationResult"],
> = ResolversObject<{
  error?: Resolver<Maybe<GQLResolversTypes["String"]>, ParentType, ContextType>;
  success?: Resolver<GQLResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLResolvers<ContextType = Context> = ResolversObject<{
  Mutation?: GQLMutationResolvers<ContextType>;
  Query?: GQLQueryResolvers<ContextType>;
  SendNotificationResult?: GQLSendNotificationResultResolvers<ContextType>;
}>;
