/** Native access identity. Workflow authority is resolved from persisted FTI relationships. */
export type JwtAccessPayload = {
  readonly sub: string;
  readonly email: string;
  readonly sesiTokenVersion?: number;
};
