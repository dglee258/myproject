import type { Route } from "./+types/profile.edit";

import { Suspense } from "react";
import { Await } from "react-router";

import ChangeEmailForm from "../components/forms/change-email-form";
import ChangePasswordForm from "../components/forms/change-password-form";
import ConnectSocialAccountsForm from "../components/forms/connect-social-accounts-form";
import DeleteAccountForm from "../components/forms/delete-account-form";
import EditProfileForm from "../components/forms/edit-profile-form";
import { getUserProfile } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `프로필 설정 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const { default: makeServerClient } = await import(
    "~/core/lib/supa-client.server"
  );
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const identities = client.auth.getUserIdentities();
  const profile = getUserProfile(client, { userId: user!.id });
  return {
    user,
    identities,
    profile,
  };
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { user, identities, profile } = loaderData;
  const hasEmailIdentity = user?.identities?.some(
    (identity) => identity.provider === "email",
  );
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          프로필 설정
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          개인 정보와 계정 설정을 관리하세요
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-8">
        <Suspense
          fallback={
            <div className="bg-card animate-fast-pulse h-60 w-full rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl dark:border-slate-800" />
          }
        >
          <Await
            resolve={profile}
            errorElement={
              <div className="text-red-500">프로필을 불러오지 못했습니다.</div>
            }
          >
            {(profile) => {
              if (!profile) {
                return null;
              }
              return (
                <EditProfileForm
                  name={(profile as any).name}
                  marketingConsent={(profile as any).marketing_consent}
                  avatarUrl={(profile as any).avatar_url}
                />
              );
            }}
          </Await>
        </Suspense>
        <ChangeEmailForm email={user?.email ?? ""} />
        <ChangePasswordForm hasPassword={hasEmailIdentity ?? false} />
        <Suspense
          fallback={
            <div className="bg-card animate-fast-pulse h-60 w-full rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl dark:border-slate-800" />
          }
        >
          <Await
            resolve={identities}
            errorElement={
              <div className="text-red-500">
                소셜 계정을 불러오지 못했습니다.
              </div>
            }
          >
            {({ data, error }) => {
              if (!data) {
                return (
                  <div className="text-red-500">
                    <span>소셜 계정을 불러오지 못했습니다.</span>
                    <span className="text-xs">코드: {error.code}</span>
                    <span className="text-xs">메시지: {error.message}</span>
                  </div>
                );
              }
              return (
                <ConnectSocialAccountsForm
                  providers={data.identities
                    .filter((identity) => identity.provider !== "email")
                    .map((identity) => identity.provider)}
                />
              );
            }}
          </Await>
        </Suspense>
        <DeleteAccountForm />
      </div>
    </div>
  );
}
