import { RegistryShell } from '@/components/registry/RegistryShell';

/**
 * Registry route: light ground.
 *
 * The homepage is near-black because it is narrative. This is not — it is read
 * densely, which is why UCSC, Ensembl, IGV and Nextstrain are all light. Applied
 * as a segment layout so it renders on the server and there is no flash.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RegistryShell voice="ui">{children}</RegistryShell>;
}
