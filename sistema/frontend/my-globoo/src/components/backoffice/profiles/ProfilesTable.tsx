import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttonf";
import { Pencil, Trash2, Users } from "lucide-react";
import { Profile } from "./ProfileForm";

interface ProfilesTableProps {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
}

export default function ProfilesTable({ profiles, onEdit, onDelete }: ProfilesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Permissões</TableHead>
          <TableHead>Usuários</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map(profile => (
          <TableRow key={profile.id}>
            <TableCell className="font-medium">{profile.name}</TableCell>
            <TableCell>{profile.description}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">{profile.permissions.length}</Badge>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <Users className="mr-1 h-3 w-3" />
                <span>{profile.userCount}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => onEdit(profile)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(profile.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}