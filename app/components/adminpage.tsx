"use client"

import type React from "react"
import { useState } from "react"
import { useMutation, useQuery, gql } from "@apollo/client"
import { getApolloClient } from "../apollo-client"
import { Search, Plus, UserCheck, UserMinus, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Navbar from "./navbar"


type User = {
  id: string
  name: string
  email: string
  admin: boolean
  moderator: boolean
}

type Category = {
  id: string
  name: string
}


const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      name
      email
      admin
      moderator
    }
  }
`

const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories {
      id
      name
    }
  }
`

const ASSIGN_MODERATOR_ROLE = gql`
  mutation AssignModeratorRole($userId: ID!) {
    assignModeratorRole(userId: $userId) {
      id
      name
      moderator
    }
  }
`

const REMOVE_MODERATOR_ROLE = gql`
  mutation RemoveModeratorRole($userId: ID!) {
    removeModeratorRole(userId: $userId) {
      id
      name
      moderator
    }
  }
`

const ADD_CATEGORY = gql`
  mutation AddCategory($name: String!) {
    addCategory(name: $name) {
      id
      name
    }
  }
`

const REMOVE_CATEGORY = gql`
  mutation RemoveCategory($categoryId: ID!) {
    removeCategory(categoryId: $categoryId)
  }
`

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [categoryName, setCategoryName] = useState<string>("")
  const [isSearching, setIsSearching] = useState<boolean>(false)

  
  const { data: usersData, loading: usersLoading } = useQuery<{ getUsers: User[] }>(GET_USERS, {
    client: getApolloClient(),
  })

  const { data: categoriesData, loading: categoriesLoading } = useQuery<{ getCategories: Category[] }>(GET_CATEGORIES, {
    client: getApolloClient(),
  })

  
  const [assignModeratorRole, { loading: assignLoading }] = useMutation(ASSIGN_MODERATOR_ROLE, {
    client: getApolloClient(),
    refetchQueries: [{ query: GET_USERS }],
  })

  const [removeModeratorRole, { loading: removeLoading }] = useMutation(REMOVE_MODERATOR_ROLE, {
    client: getApolloClient(),
    refetchQueries: [{ query: GET_USERS }],
  })

  const [addCategory, { loading: addCategoryLoading }] = useMutation(ADD_CATEGORY, {
    client: getApolloClient(),
    refetchQueries: [{ query: GET_CATEGORIES }],
  })

  const [removeCategory, { loading: removeCategoryLoading }] = useMutation(REMOVE_CATEGORY, {
    client: getApolloClient(),
    refetchQueries: [{ query: GET_CATEGORIES }],
  })

  
  const filteredUsers = usersData?.getUsers.filter(
    (user: User) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsSearching(value.length > 0)
  }

  
  const handleAssignModerator = async (userId: string) => {
    await assignModeratorRole({ variables: { userId } })
  }

  
  const handleRemoveModerator = async (userId: string) => {
    await removeModeratorRole({ variables: { userId } })
  }

  
  const handleAddCategory = async () => {
    if (!categoryName.trim()) return
    await addCategory({ variables: { name: categoryName.trim() } })
    setCategoryName("")
  }

  
  const handleRemoveCategory = async (categoryId: string) => {
    await removeCategory({ variables: { categoryId } })
  }

  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-6xl pt-28">
        <h1 className="text-3xl font-bold mb-6">Administrátorský Panel</h1>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Správa Uživatelů</TabsTrigger>
            <TabsTrigger value="categories">Kategorie</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Správa Moderátorských Rolí</CardTitle>
                <CardDescription>
                  Vyhledejte uživatele a přiřaďte nebo odeberte moderátorská oprávnění
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Hledejte podle emailu nebo jména..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>

                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div>
                    {!isSearching ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Začněte psát, abyste vyhledali uživatele
                      </div>
                    ) : filteredUsers && filteredUsers.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                {user.admin && (
                                  <Badge variant="secondary" className="ml-2">
                                    Admin
                                  </Badge>
                                )}
                                {user.moderator && <Badge className="ml-2">Moderátor</Badge>}
                              </div>

                              {user.moderator ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveModerator(user.id)}
                                  disabled={removeLoading}
                                >
                                  {removeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  Odebrat
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAssignModerator(user.id)}
                                  disabled={assignLoading}
                                >
                                  {assignLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Přiřadit
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nebyli nalezeni žádní uživatelé odpovídající &quot;{searchTerm}&quot;
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Přidat Kategorii</CardTitle>
                  <CardDescription>Vytvořte novou kategorii pro váš obsah</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="Název kategorie"
                    />
                    <Button onClick={handleAddCategory} disabled={!categoryName.trim() || addCategoryLoading}>
                      {addCategoryLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Přidat
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kategorie</CardTitle>
                  <CardDescription>Spravujte své existující kategorie</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoriesLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : categoriesData?.getCategories && categoriesData.getCategories.length > 0 ? (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-1">
                        {categoriesData.getCategories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors"
                          >
                            <span>{category.name}</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveCategory(category.id)}
                              disabled={removeCategoryLoading}
                            >
                              {removeCategoryLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Odebrat"
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">Nebyly nalezeny žádné kategorie</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}