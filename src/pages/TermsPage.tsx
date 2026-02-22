import React from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto min-h-screen p-4">
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-6 pt-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold dark:text-dark-button">{t("terms.title")}</h1>
          <p className="text-muted-foreground dark:text-dark-field">{t("terms.subtitle")}</p>
        </div>

        <div className="rounded-xl border bg-background/60 p-6 backdrop-blur dark:border-dark-field">
          <h2 className="mb-3 text-xl font-semibold dark:text-dark-button">{t("terms.sectionSafetyTitle")}</h2>
          <ul className="list-disc space-y-2 ps-5 text-sm text-muted-foreground dark:text-dark-field">
            <li>{t("terms.safety.1")}</li>
            <li>{t("terms.safety.2")}</li>
            <li>{t("terms.safety.3")}</li>
            <li>{t("terms.safety.4")}</li>
            <li>{t("terms.safety.5")}</li>
            <li>{t("terms.safety.6")}</li>
          </ul>
        </div>

        <div className="rounded-xl border bg-background/60 p-6 backdrop-blur dark:border-dark-field">
          <h2 className="mb-3 text-xl font-semibold dark:text-dark-button">{t("terms.sectionLiabilityTitle")}</h2>
          <p className="text-sm text-muted-foreground dark:text-dark-field">
            {t("terms.liability.p1")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground dark:text-dark-field">
            {t("terms.liability.p2")}
          </p>
        </div>

        <div className="rounded-xl border bg-background/60 p-6 backdrop-blur dark:border-dark-field">
          <h2 className="mb-3 text-xl font-semibold dark:text-dark-button">{t("terms.sectionRulesTitle")}</h2>
          <ul className="list-disc space-y-2 ps-5 text-sm text-muted-foreground dark:text-dark-field">
            <li>{t("terms.rules.1")}</li>
            <li>{t("terms.rules.2")}</li>
            <li>{t("terms.rules.3")}</li>
            <li>{t("terms.rules.4")}</li>
            <li>{t("terms.rules.5")}</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground dark:text-dark-field">
            {t("terms.lastUpdated")}
          </p>

          <div className="flex gap-2">
            <Button asChild variant="outline" className="dark:border-dark-field dark:text-dark-button">
              <Link to="/signup">{t("terms.backToSignup")}</Link>
            </Button>
            <Button asChild className="dark:bg-dark-button dark:text-dark-background dark:hover:bg-dark-button/90">
              <Link to="/">{t("terms.goHome")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;