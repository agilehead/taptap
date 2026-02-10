import type { GraphQLResolveInfo } from 'graphql';
import type { Context } from '../context/index.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type GQLEmailRecipientInput = {
  email: Scalars['String']['input'];
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type GQLEmailTemplate = {
  __typename?: 'EmailTemplate';
  bodyHtml: Scalars['String']['output'];
  bodyText: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  name: Scalars['String']['output'];
  subject: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type GQLMutation = {
  __typename?: 'Mutation';
  deleteEmailTemplate: Scalars['Boolean']['output'];
  registerEmailTemplate: GQLEmailTemplate;
  sendEmail: GQLSendResult;
  sendRawEmail: GQLSendResult;
  updateEmailTemplate: GQLEmailTemplate;
};


export type GQLMutationDeleteEmailTemplateArgs = {
  name: Scalars['String']['input'];
};


export type GQLMutationRegisterEmailTemplateArgs = {
  input: GQLRegisterEmailTemplateInput;
};


export type GQLMutationSendEmailArgs = {
  input: GQLSendEmailInput;
};


export type GQLMutationSendRawEmailArgs = {
  input: GQLSendRawEmailInput;
};


export type GQLMutationUpdateEmailTemplateArgs = {
  input: GQLUpdateEmailTemplateInput;
  name: Scalars['String']['input'];
};

export type GQLQuery = {
  __typename?: 'Query';
  emailTemplate: Maybe<GQLEmailTemplate>;
  emailTemplates: Array<GQLEmailTemplate>;
  health: Scalars['String']['output'];
};


export type GQLQueryEmailTemplateArgs = {
  name: Scalars['String']['input'];
};

export type GQLRegisterEmailTemplateInput = {
  bodyHtml: Scalars['String']['input'];
  bodyText: Scalars['String']['input'];
  name: Scalars['String']['input'];
  subject: Scalars['String']['input'];
};

export type GQLSendEmailInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  contextId?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['String']['input']>;
  recipient: GQLEmailRecipientInput;
  template: Scalars['String']['input'];
  throttleIntervalMs?: InputMaybe<Scalars['Int']['input']>;
  variables?: InputMaybe<Scalars['String']['input']>;
};

export type GQLSendRawEmailInput = {
  bodyHtml: Scalars['String']['input'];
  bodyText: Scalars['String']['input'];
  category?: InputMaybe<Scalars['String']['input']>;
  contextId?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['String']['input']>;
  recipient: GQLEmailRecipientInput;
  subject: Scalars['String']['input'];
  throttleIntervalMs?: InputMaybe<Scalars['Int']['input']>;
};

export type GQLSendResult = {
  __typename?: 'SendResult';
  error: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  throttled: Scalars['Boolean']['output'];
};

export type GQLUpdateEmailTemplateInput = {
  bodyHtml?: InputMaybe<Scalars['String']['input']>;
  bodyText?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type GQLResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  EmailRecipientInput: GQLEmailRecipientInput;
  EmailTemplate: ResolverTypeWrapper<GQLEmailTemplate>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  RegisterEmailTemplateInput: GQLRegisterEmailTemplateInput;
  SendEmailInput: GQLSendEmailInput;
  SendRawEmailInput: GQLSendRawEmailInput;
  SendResult: ResolverTypeWrapper<GQLSendResult>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  UpdateEmailTemplateInput: GQLUpdateEmailTemplateInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type GQLResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  EmailRecipientInput: GQLEmailRecipientInput;
  EmailTemplate: GQLEmailTemplate;
  Int: Scalars['Int']['output'];
  Mutation: {};
  Query: {};
  RegisterEmailTemplateInput: GQLRegisterEmailTemplateInput;
  SendEmailInput: GQLSendEmailInput;
  SendRawEmailInput: GQLSendRawEmailInput;
  SendResult: GQLSendResult;
  String: Scalars['String']['output'];
  UpdateEmailTemplateInput: GQLUpdateEmailTemplateInput;
}>;

export type GQLEmailTemplateResolvers<ContextType = Context, ParentType extends GQLResolversParentTypes['EmailTemplate'] = GQLResolversParentTypes['EmailTemplate']> = ResolversObject<{
  bodyHtml?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  bodyText?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  subject?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLMutationResolvers<ContextType = Context, ParentType extends GQLResolversParentTypes['Mutation'] = GQLResolversParentTypes['Mutation']> = ResolversObject<{
  deleteEmailTemplate?: Resolver<GQLResolversTypes['Boolean'], ParentType, ContextType, RequireFields<GQLMutationDeleteEmailTemplateArgs, 'name'>>;
  registerEmailTemplate?: Resolver<GQLResolversTypes['EmailTemplate'], ParentType, ContextType, RequireFields<GQLMutationRegisterEmailTemplateArgs, 'input'>>;
  sendEmail?: Resolver<GQLResolversTypes['SendResult'], ParentType, ContextType, RequireFields<GQLMutationSendEmailArgs, 'input'>>;
  sendRawEmail?: Resolver<GQLResolversTypes['SendResult'], ParentType, ContextType, RequireFields<GQLMutationSendRawEmailArgs, 'input'>>;
  updateEmailTemplate?: Resolver<GQLResolversTypes['EmailTemplate'], ParentType, ContextType, RequireFields<GQLMutationUpdateEmailTemplateArgs, 'input' | 'name'>>;
}>;

export type GQLQueryResolvers<ContextType = Context, ParentType extends GQLResolversParentTypes['Query'] = GQLResolversParentTypes['Query']> = ResolversObject<{
  emailTemplate?: Resolver<Maybe<GQLResolversTypes['EmailTemplate']>, ParentType, ContextType, RequireFields<GQLQueryEmailTemplateArgs, 'name'>>;
  emailTemplates?: Resolver<Array<GQLResolversTypes['EmailTemplate']>, ParentType, ContextType>;
  health?: Resolver<GQLResolversTypes['String'], ParentType, ContextType>;
}>;

export type GQLSendResultResolvers<ContextType = Context, ParentType extends GQLResolversParentTypes['SendResult'] = GQLResolversParentTypes['SendResult']> = ResolversObject<{
  error?: Resolver<Maybe<GQLResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<GQLResolversTypes['Boolean'], ParentType, ContextType>;
  throttled?: Resolver<GQLResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type GQLResolvers<ContextType = Context> = ResolversObject<{
  EmailTemplate?: GQLEmailTemplateResolvers<ContextType>;
  Mutation?: GQLMutationResolvers<ContextType>;
  Query?: GQLQueryResolvers<ContextType>;
  SendResult?: GQLSendResultResolvers<ContextType>;
}>;

